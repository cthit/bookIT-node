UPDATE event 
    SET phone='',
    booked_by=''
    WHERE event.end <= NOW()::DATE-14;
