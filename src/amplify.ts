import { Amplify } from "aws-amplify";

let configured = false;

export function configureAmplify(identityPoolId: string, region: string) {
  if (configured) return;

  Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId,
        region,
        allowGuestAccess: true, //OBLIGATORIO
      },
    },
  });

  configured = true;
}
