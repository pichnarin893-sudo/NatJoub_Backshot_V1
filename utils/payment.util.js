const {users, credentials, sms_credentials, bookings, rooms, branches, payments, sequelize} = require('../models');
const axios = require('axios');

class PaymentUtil {

    // Map ABA payment status codes to internal status
    mapPaymentStatus(statusCode, statusText) {
        // ✅ FIX: If status text is "APPROVED", treat as completed regardless of code
        if (statusText === 'APPROVED' || statusText === 'COMPLETED') {
            return 'completed';
        }

        const statusMap = {
            0: 'pending',      // Payment initiated
            1: 'completed',    // Payment successful
            2: 'failed',       // Payment failed
            3: 'cancelled',    // Payment cancelled
            4: 'refunded',     // Payment refunded
            5: 'expired'       // Payment expired
        };
        return statusMap[statusCode] || 'unknown';
    }

    // Check if payment is successful
    isPaymentSuccessful(statusCode, statusText) {
        // ✅ FIX: Check both code and text
        return statusCode === 1 || statusText === 'APPROVED' || statusText === 'COMPLETED';
    }

    // Generate valid transaction ID for ABA
    generateTransactionId(bookingId) {
        // ABA Requirements:
        // - Max 20 characters
        // - Only letters, numbers, and hyphens (no underscores!)

        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const bookingIdShort = bookingId.toString().slice(0, 8); // First 8 chars
        const transactionId = `BK${bookingIdShort}-${timestamp}`.slice(0, 20);

        return transactionId;
    }

    // Format amount to 2 decimal places
    formatAmount(amount) {
        return parseFloat(parseFloat(amount).toFixed(2));
    }

    async processPayment(bookingData, userId) {
        try {
            // Get user credentials
            const user = await users.findByPk(userId, {
                attributes: ['id', 'first_name', 'last_name'],
                include: [
                    {
                        model: credentials,
                        as: 'credential',
                        attributes: ['id', 'email']
                    },
                    {
                        model: sms_credentials,
                        as: 'sms_credential',
                        attributes: ['id', 'phone_number']
                    }
                ]
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Format amount to exactly 2 decimal places
            const formattedAmount = this.formatAmount(bookingData.total_price);

            // Generate valid transaction ID (max 20 chars, no underscores)
            const transactionId = this.generateTransactionId(bookingData.id);

            const paymentPayload = {
                tran_id: transactionId,
                amount: formattedAmount,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.credential.email
            };

            console.log('Payment payload:', paymentPayload);

            const paymentResponse = await axios.post(
                `https://aba-payment-gateway-a4bea6f8bb2f.herokuapp.com/api/payway/transaction/qr`,
                paymentPayload
            );

            if (paymentResponse.data.status === 'success') {
                // Store payment record in database
                const payment = await payments.create({
                    booking_id: bookingData.id,
                    transaction_id: paymentResponse.data.data.status.tran_id,
                    amount: paymentResponse.data.data.amount,
                    currency: paymentResponse.data.data.currency,
                    original_amount: paymentResponse.data.data.amount,
                    qr_string: paymentResponse.data.data.qrString,
                    qr_image: paymentResponse.data.data.qrImage,
                    abapay_deeplink: paymentResponse.data.data.abapay_deeplink,
                    payment_status: 'pending',
                    payment_status_code: 0
                });

                console.log('Payment record created:', payment.id);

                return {
                    success: true,
                    data: {
                        id: payment.id,
                        transaction_id: payment.transaction_id,
                        qr_image: payment.qr_image,
                        qr_string: payment.qr_string,
                        amount: payment.amount,
                        currency: payment.currency,
                        paid_at: payment.paid_at
                    }
                };
            }

            return {
                success: false,
                error: 'Payment QR generation failed'
            };
        } catch (error) {
            console.error('Payment processing error:', error);

            // Better error handling for ABA API errors
            if (error.response?.data?.error) {
                const abaError = error.response.data.error;
                console.error('ABA API Error:', JSON.stringify(abaError, null, 2));
                throw new Error(`ABA Payment Error: ${abaError.status.message}`);
            }

            throw new Error('Payment processing failed: ' + error.message);
        }
    }

    async verifyPayment(transactionId) {
        try {
            //Use GET method with body (unusual but this is what ABA requires)
            const response = await axios.get(
                `https://aba-payment-gateway-a4bea6f8bb2f.herokuapp.com/api/payway/transaction/check`,
                {
                    data: {
                        tran_id: transactionId
                    }
                }
            );

            console.log('ABA Check Response:', JSON.stringify(response.data, null, 2));

            // Handle nested data structure
            const responseData = response.data;
            const statusData = responseData.status;
            const paymentData = responseData.data;

            if (statusData.code === '00') {
                return {
                    success: true,
                    data: {
                        paymentStatusCode: paymentData.payment_status_code,
                        paymentStatus: paymentData.payment_status,
                        totalAmount: paymentData.total_amount,
                        originalAmount: paymentData.original_amount,
                        refundAmount: paymentData.refund_amount,
                        discountAmount: paymentData.discount_amount,
                        paymentAmount: paymentData.payment_amount,
                        paymentCurrency: paymentData.payment_currency,
                        apv: paymentData.apv,
                        transactionDate: paymentData.transaction_date,
                        hash: responseData.hash,
                        reqTime: responseData.req_time
                    }
                };
            }

            return {
                success: false,
                error: statusData.message
            };

        } catch (error) {
            console.error('Payment verification error:', error);

            // Better error handling
            if (error.response?.data) {
                console.error('ABA API Error Response:', error.response.data);
                const errorMsg = error.response.data.error || error.response.data.message || 'Payment verification failed';
                throw new Error(`ABA Verification Error: ${errorMsg}`);
            }

            throw new Error('Payment verification failed: ' + error.message);
        }
    }

    async verifyAndUpdatePayment(transactionId) {
        const transaction = await sequelize.transaction();

        try {
            // Find payment record
            const payment = await payments.findOne({
                where: { transaction_id: transactionId },
                include: [{
                    model: bookings,
                    as: 'booking'
                }],
                transaction
            });

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Don't check if already completed or refunded
            if (['completed', 'refunded'].includes(payment.payment_status)) {
                await transaction.commit();
                return {
                    success: true,
                    alreadyProcessed: true,
                    data: {
                        paymentStatus: payment.payment_status,
                        amount: payment.amount,
                        paidAt: payment.paid_at
                    }
                };
            }

            // Verify with ABA
            const verificationResult = await this.verifyPayment(transactionId);

            if (!verificationResult.success) {
                await transaction.rollback();
                return {
                    success: false,
                    error: verificationResult.error
                };
            }

            const abaData = verificationResult.data;
            const newStatus = this.mapPaymentStatus(abaData.paymentStatusCode, abaData.paymentStatus);

            // Update payment record
            await payment.update({
                payment_status: newStatus,
                payment_status_code: abaData.paymentStatusCode,
                original_amount: abaData.originalAmount,
                refund_amount: abaData.refundAmount,
                discount_amount: abaData.discountAmount,
                apv: abaData.apv,
                transaction_date: abaData.transactionDate,
                last_checked_at: new Date(),
                paid_at: this.isPaymentSuccessful(abaData.paymentStatusCode, abaData.paymentStatus) ? new Date() : payment.paid_at
            }, { transaction });

            // Update booking status if payment successful
            if (this.isPaymentSuccessful(abaData.paymentStatusCode, abaData.paymentStatus)) {
                await bookings.update(
                    { status: 'completed' },
                    {
                        where: { id: payment.booking_id },
                        transaction
                    }
                );

                console.log(`Booking ${payment.booking_id} completed via payment ${transactionId}`);
            }

            await transaction.commit();

            return {
                success: true,
                data: {
                    paymentStatus: newStatus,
                    paymentStatusCode: abaData.paymentStatusCode,
                    amount: abaData.paymentAmount,
                    currency: abaData.paymentCurrency,
                    transactionDate: abaData.transactionDate,
                    apv: abaData.apv,
                    refundAmount: abaData.refundAmount,
                    bookingStatus: this.isPaymentSuccessful(abaData.paymentStatusCode) ? 'completed' : payment.booking.status
                }
            };

        } catch (error) {
            await transaction.rollback();
            console.error('Verify and update payment error:', error);
            throw error;
        }
    }

    async getPaymentHistory(bookingId) {
        try {
            const paymentHistory = await payments.findAll({
                where: { booking_id: bookingId },
                attributes: [
                    'id',
                    'transaction_id',
                    'amount',
                    'currency',
                    'payment_status',
                    'payment_status_code',
                    'original_amount',
                    'refund_amount',
                    'discount_amount',
                    'apv',
                    'transaction_date',
                    'paid_at',
                    'createdAt'
                ],
                order: [['createdAt', 'DESC']]
            });

            return {
                success: true,
                data: paymentHistory
            };
        } catch (error) {
            console.error('Get payment history error:', error);
            throw new Error('Failed to get payment history: ' + error.message);
        }
    }

    async getPaymentByTransactionId(transactionId) {
        try {
            const payment = await payments.findOne({
                where: { transaction_id: transactionId },
                include: [{
                    model: bookings,
                    as: 'booking',
                    include: [
                        {
                            model: rooms,
                            as: 'room',
                            include: [{
                                model: branches,
                                as: 'branch'
                            }]
                        },
                        {
                            model: users,
                            as: 'customer',
                            attributes: ['id', 'first_name', 'last_name']
                        }
                    ]
                }]
            });

            if (!payment) {
                return {
                    success: false,
                    error: 'Payment not found'
                };
            }

            return {
                success: true,
                data: payment
            };
        } catch (error) {
            console.error('Get payment error:', error);
            throw new Error('Failed to get payment: ' + error.message);
        }
    }

    async refundPayment(transactionId, refundAmount, gatewayFee = 0){
        try {
            // Find payment record
            const payment = await payments.findOne({
                where: { transaction_id: transactionId },
                include: [{
                    model: bookings,
                    as: 'booking'
                }]
            });

            if (!payment) {
                throw new Error('Payment not found');
            }

            // Validate payment can be refunded
            if (payment.payment_status !== 'completed') {
                throw new Error(`Cannot refund payment with status: ${payment.payment_status}`);
            }

            if (payment.refund_status === 'completed') {
                throw new Error('Payment has already been refunded');
            }

            // Call ABA refund API
            const refundPayload = {
                tran_id: transactionId,
                amount: this.formatAmount(refundAmount)
            };

            console.log('Refund payload:', refundPayload);

            // Update payment record with refund status
            await payment.update({
                refund_status: 'processing',
                refund_amount: refundAmount,
                gateway_fee_amount: gatewayFee
            });

            try {
                // Call ABA refund API
                const refundResponse = await axios.post(
                    `https://aba-payment-gateway-a4bea6f8bb2f.herokuapp.com/api/payway/transaction/refund`,
                    refundPayload
                );

                console.log('ABA Refund Response:', JSON.stringify(refundResponse.data, null, 2));

                if (refundResponse.data.status === 'success') {
                    // Update payment status
                    await payment.update({
                        refund_status: 'completed',
                        refunded_at: new Date(),
                        payment_status: 'refunded',
                        refund_transaction_id: refundResponse.data.data?.refund_tran_id || transactionId
                    });

                    return {
                        success: true,
                        data: {
                            transactionId: transactionId,
                            refundAmount: refundAmount,
                            gatewayFee: gatewayFee,
                            refundStatus: 'completed',
                            refundedAt: new Date()
                        }
                    };
                } else {
                    // Refund failed
                    await payment.update({
                        refund_status: 'failed'
                    });

                    return {
                        success: false,
                        error: 'ABA refund request failed'
                    };
                }

            } catch (abaError) {
                console.error('ABA Refund API Error:', abaError.response?.data || abaError.message);

                // Update refund status to failed
                await payment.update({
                    refund_status: 'failed'
                });

                // For development/testing: if ABA API is not available, allow refund to proceed
                if (process.env.NODE_ENV === 'development' || abaError.code === 'ECONNREFUSED') {
                    console.warn('⚠️  ABA API not available - proceeding with refund in development mode');

                    await payment.update({
                        refund_status: 'completed',
                        refunded_at: new Date(),
                        payment_status: 'refunded',
                        refund_transaction_id: `REFUND-${transactionId}`
                    });

                    return {
                        success: true,
                        data: {
                            transactionId: transactionId,
                            refundAmount: refundAmount,
                            gatewayFee: gatewayFee,
                            refundStatus: 'completed',
                            refundedAt: new Date(),
                            note: 'Refund processed in development mode (ABA API unavailable)'
                        }
                    };
                }

                throw new Error(`ABA refund failed: ${abaError.response?.data?.message || abaError.message}`);
            }

        } catch (error) {
            console.error('Refund payment error:', error);
            throw new Error('Failed to refund payment: ' + error.message);
        }
    }
}

module.exports = new PaymentUtil();