import sgMail from '@sendgrid/mail';
import connectDB from '@/config/database';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const POST = async (req) => {
  try {
    await connectDB();

    const { owner_email, owner_property_name, owner_name, name, email, phone, message } = await req.json();

    const msg = {
      to: owner_email,
      from: 'lungancatalin@gmail.com',
      template_id: 'd-29c22056b12a4838bf62efa6288dd94a',
      dynamic_template_data: {
        subject: `Someone is interested in your ${owner_property_name}`,
        owner_name: owner_name,
        owner_property_name: owner_property_name,
        owner_email: owner_email,
        name: name,
        email: email,
        phone: phone,
        message: message,
      },
    };

    await sgMail.send(msg);

    return new Response(JSON.stringify({ message: 'Message sent successfully' }), { status: 200 });
  } catch (error) {
    console.log('SendGrid error:', error.response.body.errors);
    return new Response(JSON.stringify({ error: 'Failed to send message' }), { status: 500 });
  }
};