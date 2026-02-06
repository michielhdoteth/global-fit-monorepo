import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, sendSimpleWhatsAppMessage } from '@/lib/twilio';
import { requireUser } from '@/lib/token-auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const currentUser = await requireUser(request.headers.get("authorization"));
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, contentSid, contentVariables, message } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Recipient number (to) is required' },
        { status: 400 }
      );
    }

    let result;

    if (contentSid) {
      // Send using content template (like your curl example)
      result = await sendWhatsAppMessage(to, contentSid, contentVariables);
    } else if (message) {
      // Send simple text message
      result = await sendSimpleWhatsAppMessage(to, message);
    } else {
      return NextResponse.json(
        { error: 'Either contentSid (for templates) or message (for text) is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Twilio WhatsApp API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send WhatsApp message',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
