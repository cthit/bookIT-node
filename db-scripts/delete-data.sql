UPDATE event 
    SET phone='',
    booked_by=''
    WHERE event.end <= NOW()::DATE-14;

DELETE FROM party_report USING event
    WHERE party_report.id=event.party_report_id AND
          event.end <= NOW()::DATE-14;
