const twilio = require('twilio');
const { users, roles, sms_credentials } = require('../../../../models');
const { generateToken } = require('../../../../utils/jwt.util');
const { SuccessResponse, ErrorResponse } = require('../../../api/v1/baseApi.controller');
const {errorResponse, successResponse} = require("../baseApi.controller");

// load environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERCICE_ID;
const client = require('twilio')(accountSid, authToken);


/**
 * send otp to user's phone number
 * use case only for room owner and customer
 */

async function initialSmsLogin(phoneNumber)  {
    try{
        //format for khmer only +855XXXXXXXXX
        if(!/^\+855\d{8,9}$/.test(phoneNumber)){
            throw new Error('Invalid phone number format. Use +855XXXXXXXXX');
        }

        console.log(phoneNumber);

        const sms_credential = await sms_credentials.findOne({
            where: { phone_number: phoneNumber },
            include: [{
                model: users,
                as: 'user',
                include: [{
                    model: roles,
                    as: 'role'
                }]
            }]
        });

        if (!sms_credential || !sms_credential.user) {
            throw new Error('Phone number not registered. Please register first.');
        }

        if (!['owner', 'customer'].includes(sms_credential.user.role.name)) {
            throw new Error('Unauthorized role for SMS login');
        }

        // Send OTP via Twilio Verify
        const verification = await client.verify.v2
            .services(serviceSid)
            .verifications.create({
                to: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
                channel: 'sms'
            });

        console.log('Twilio verification response:', verification.sid);

        if(verification.status === 'pending'){
            await sms_credential.update({
                last_otp_sent_at: new Date(),
            })
        }

        return {
            userId: sms_credential.user_id,
            phoneNumber: sms_credential.phone_number,
            role: sms_credential.user.role.name,
            requiresOTP: true,
            verificationSid: verification.sid,
            verificationStatus: verification.status,
            verificationTo: verification.to
        }
    } catch (error) {
        console.error('Error sending OTP via SMS:', error);
        throw error;
    }
}


/**
 * verify otp and complete login process as customer or room owner
 */

async function verifySmsOTP(phoneNumber, otp){
    try{

        //format for khmer only +855XXXXXXXXX
        if(!/^\+855\d{8,9}$/.test(phoneNumber)){
            throw new Error('Invalid phone number format. Use +855XXXXXXXXX');
        }

        const sms_credential = await sms_credentials.findOne({
            where: { phone_number: phoneNumber },
            include: [{
                model: users,
                as: 'user',
                include: [{
                    model: roles,
                    as: 'role'
                }]
            }]
        });

        if (!sms_credential || !sms_credential.user) {
            throw new Error('Phone number not registered. Please register first.');
        }

        if (!['owner', 'customer'].includes(sms_credential.user.role.name)) {
            throw new Error('Unauthorized role for SMS login');
        }

        //verify the code
        const verification_check = await client.verify.v2
            .services(serviceSid)
            .verificationChecks.create({
                to: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
                code: otp
            })

        if(verification_check.status !== 'approved'){
            throw new Error('Invalid OTP code');
        }else if(verification_check.status === 'approved'){
            await sms_credential.update({
                verified_at: new Date(),
                is_phone_verified: true
            })
        }

        // Generate JWT token
        const token = await generateToken({
            id: sms_credential.user_id,
            role: sms_credential.user.role ? sms_credential.user.role.name : 'user',
            role_id: sms_credential.user.role_id
        });

        // return user info and token
        return {
            user:{
                userId: sms_credential.user_id,
                phoneNumber: sms_credential.phone_number,
                role: sms_credential.user.role.name,
                requiresOTP: false,
                verificationSid: verification_check.sid,
                verificationTo: verification_check.to,
                verificationStatus: verification_check.status
            },
            token
        }

    }catch (error) {
        console.error('Error sending OTP via SMS:', error);
        throw error;
    }
}

/**
 * generate token for owner and customer
 */

async function generateUserToken(user){
    return generateToken({
        id: user.id,
        role_id: user.role_id
    })
}

/**
 * Get user by ID
 */

async function getUserById(userId){
    try{
        return await users.findByPk(userId, {
            attributes: ['id', 'role_id'],
            include: [{
                model: sms_credentials,
                as: 'sms_credential',
                attributes: ['phone_number']
            }]
        });
    }catch (error) {
        console.error('Get user by ID error:', error);
        throw error;
    }
}

module.exports = {
    initialSmsLogin,
    verifySmsOTP,
    generateToken: generateUserToken,
    getUserById
}