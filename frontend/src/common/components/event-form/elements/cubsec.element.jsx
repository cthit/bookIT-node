import {
    DigitCheckbox,
    useDigitFormField,
  } from "@cthit/react-digit-components";
  
  const Cubsec = ({ preLinkLabel, linkLabel }) => {
    const cubsecValues = useDigitFormField("cubsec");
  
    return (
        <DigitCheckbox
          {...cubsecValues}
          label={
            <p>
              {preLinkLabel}
              <a
                href="https://www.chalmers.se/utbildning/studera-hos-oss/studentliv/arrangemang-i-sektionslokaler/formular-for-anmalan-av-arrangemang/"
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
  
  export default Cubsec;
