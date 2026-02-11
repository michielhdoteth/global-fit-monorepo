// Mock booking data storage
const bookings = new Map();

export async function bookingTool(args) {
  const { action, name, phone, date, time, service } = args;

  switch (action) {
    case 'create':
      if (!name || !phone || !date || !time || !service) {
        return {
          success: false,
          error: 'Missing required fields: name, phone, date, time, service'
        };
      }

      const bookingId = Date.now().toString();
      const booking = {
        id: bookingId,
        name,
        phone,
        date,
        time,
        service,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      bookings.set(bookingId, booking);

      return {
        success: true,
        booking,
        message: `Booking confirmed for ${name} on ${date} at ${time} for ${service}. Booking ID: ${bookingId}`
      };

    case 'check':
      if (!phone) {
        return {
          success: false,
          error: 'Phone number is required to check bookings'
        };
      }

      const customerBookings = Array.from(bookings.values())
        .filter(b => b.phone === phone);

      if (customerBookings.length === 0) {
        return {
          success: true,
          bookings: [],
          message: 'No bookings found for this phone number'
        };
      }

      return {
        success: true,
        bookings: customerBookings,
        message: `Found ${customerBookings.length} booking(s)`
      };

    case 'cancel':
      if (!phone || !date || !time) {
        return {
          success: false,
          error: 'Phone number, date, and time are required to cancel a booking'
        };
      }

      let cancelled = false;
      for (const [id, booking] of bookings.entries()) {
        if (booking.phone === phone && booking.date === date && booking.time === time) {
          booking.status = 'cancelled';
          cancelled = true;
          break;
        }
      }

      if (cancelled) {
        return {
          success: true,
          message: 'Booking cancelled successfully'
        };
      } else {
        return {
          success: false,
          message: 'No matching booking found to cancel'
        };
      }

    default:
      return {
        success: false,
        error: 'Unknown action. Use: create, check, or cancel'
      };
  }
}
