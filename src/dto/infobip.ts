interface InfoBipDestination {
  to: string;
}

interface InfoBipMessage {
  from: string;
  destinations: Array<InfoBipDestination>;
  text: string;
  notifyUrl: string;
}

export class InfoBipDto {
  messages: Array<InfoBipMessage>;
}
