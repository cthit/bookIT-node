import {
  DigitCheckbox,
  useDigitFormField,
} from "@cthit/react-digit-components";

const GDPR = ({ preLinkLabel, linkLabel, onLinkClick }) => {
  const gdprValues = useDigitFormField("gdpr");

  return (
    <DigitCheckbox
      {...gdprValues}
      label={
        <p>
          {preLinkLabel} {/*eslint-disable-next-line*/}
          <a href="#" onClick={() => onLinkClick()}>
            {linkLabel}
          </a>
        </p>
      }
      size={{ width: "100%" }}
    />
  );
};

export default GDPR;
