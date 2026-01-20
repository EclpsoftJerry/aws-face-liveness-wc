import { Amplify } from "aws-amplify";

let configured = false;

export function configureAmplify(identityPoolId: string) {
  if (configured) return;

  Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId,        
        allowGuestAccess: true, //OBLIGATORIO
      },
    },
  });

  configured = true;
}
