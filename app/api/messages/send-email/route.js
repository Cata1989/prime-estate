import { Resend } from 'resend';
import connectDB from '@/config/database';
import Message from '@/models/Message';

const resend = new Resend(process.env.RESEND_API_KEY);

export const POST = async (req) => {
  try {
    await connectDB();

    const { name, email, phone, message, recipient, property } = await req.json();

    // Send email notification to recipient using the Resend service
    const emailResponse = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `New message about property ${property}`,
      html: `
        <h1>New Message Received</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p>Please log in to the platform to reply.</p>
      `
    });

    console.log('emailResponse', emailResponse);
    return new Response(JSON.stringify({ message: 'Message sent successfully', emailResponse }), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 500 });
  }
}