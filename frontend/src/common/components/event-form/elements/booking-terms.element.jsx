import {
  DigitCheckbox,
  useDigitFormField,
} from "@cthit/react-digit-components";

const BookingTerms = ({ preLinkLabel, linkLabel }) => {
  const bookingTermsValues = useDigitFormField("booking_terms");

  return (
    <DigitCheckbox
      {...bookingTermsValues}
      label={
        <p>
          {preLinkLabel}
          <a
            href="https://docs.chalmers.it/bokningsvillkor.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkLabel}
          </a>
        </p>
      }
      size={{ width: "100%" }}
    />
  );
};

export default BookingTerms;
