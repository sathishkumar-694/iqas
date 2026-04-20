import { Resend } from 'resend';

const getResend = () => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY is not defined. Emails will not be sent.');
        return null;
    }
    return new Resend(process.env.RESEND_API_KEY);
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export const sendWelcomeEmail = async (user) => {
    const resend = getResend();
    if (!resend) return;

    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n📧 [DEV] Welcome Email -> To: ${user.email}, Role: ${user.role}\n`);
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'Welcome to IQAS! 🚀',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Welcome to IQAS, ${user.username}!</h2>
                    <p>Your account has been successfully created with the role of <strong>${user.role}</strong>.</p>
                    <p>You can now log in to the dashboard to begin managing projects and hunting bugs.</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="color: #666; font-size: 14px;">Happy testing!<br/>The IQAS Team</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

export const sendBugAssignmentEmail = async (user, bugTitle, bugLink) => {
    const resend = getResend();
    if (!resend) return;

    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n📧 [DEV] Bug Assignment -> To: ${user.email}, Title: ${bugTitle}\n`);
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: `Action Required: You've been assigned a bug! 🚨`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>New Assignment</h2>
                    <p>Hi ${user.username}, you have been assigned to investigate and resolve the following bug:</p>
                    <div style="padding: 15px; background-color: #f6f8fa; border-radius: 6px; margin: 20px 0;">
                        <strong>${bugTitle}</strong>
                    </div>
                    <a href="${bugLink}" style="display: inline-block; padding: 10px 20px; background-color: #0366d6; color: white; text-decoration: none; border-radius: 5px;">View Bug Details</a>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="color: #666; font-size: 14px;">If you received this in error, please contact your Team Lead.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('Error sending bug assignment email:', error);
    }
};

export const sendProjectInviteEmail = async (user, projectName, clientUrl) => {
    const resend = getResend();
    if (!resend) return;

    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n📧 [DEV] Project Invitation -> To: ${user.email}, Project: ${projectName}\n`);
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: `Invitation: You've been added to ${projectName} 🏢`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Project Invitation</h2>
                    <p>Hi ${user.username}, you have been officially added to the <strong>${projectName}</strong> team.</p>
                    <a href="${clientUrl}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="color: #666; font-size: 14px;">The IQAS Team</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('Error sending project invite email:', error);
    }
};

export const sendStatusUpdateEmail = async (user, bugTitle, newStatus, bugLink) => {
    const resend = getResend();
    if (!resend) return;

    if (process.env.NODE_ENV !== 'production') {
        console.log(`\n📧 [DEV] Status Update -> To: ${user.email}, Bug: ${bugTitle}, Status: ${newStatus}\n`);
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: `Update: Bug status changed to ${newStatus} 📋`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Bug Status Updated</h2>
                    <p>Hi ${user.username}, there was a status update on a bug you reported or supervise.</p>
                    <p><strong>Bug:</strong> ${bugTitle}</p>
                    <p><strong>New Status:</strong> <span style="background-color: #e1e4e8; padding: 3px 8px; border-radius: 12px; font-size: 14px;">${newStatus}</span></p>
                    <a href="${bugLink}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #0366d6; color: white; text-decoration: none; border-radius: 5px;">View Bug</a>
                </div>
            `,
        });
    } catch (error) {
        console.error('Error sending status update email:', error);
    }
};

export const sendPasswordResetEmail = async (user, resetUrl) => {
    const resend = getResend();
    if (!resend) return;

    if (process.env.NODE_ENV !== 'production') {
        console.log('\n--- 🔐 [DEV] PASSWORD RESET EMAIL ---');
        console.log(`To: ${user.email}`);
        console.log(`Link: ${resetUrl}`);
        console.log('-------------------------------------\n');
    }

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: 'IQAS - Password Reset Request 🔐',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>Hi ${user.username},</p>
                    <p>We received a request to reset your password for your IQAS account. Click the button below to set a new password. This link will expire in 30 minutes.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0366d6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset My Password</a>
                    </div>
                    <p style="font-size: 14px; color: #666;">If the button above doesn't work, copy and paste this link into your browser:</p>
                    <p style="font-size: 14px; color: #0366d6; word-break: break-all;">${resetUrl}</p>
                    <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
                    <p style="color: #666; font-size: 12px;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
};
