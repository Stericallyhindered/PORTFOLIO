library;

const String kServiceUuid = '4faf2012-1fb5-459e-8fcc-c5c9c331914b';
const String kDeviceInfoUuid = '4faf2012-1fb5-459e-8fcc-c5c9c331914c';
const String kLiveStatusUuid = '4faf2012-1fb5-459e-8fcc-c5c9c331914d';
const String kActivePresetUuid = '4faf2012-1fb5-459e-8fcc-c5c9c331914e';
const String kConfigControlUuid = '4faf2012-1fb5-459e-8fcc-c5c9c331914f';
const String kConfigDataUuid = '4faf2012-1fb5-459e-8fcc-c5c9c3319150';
const String kOtaControlUuid = '4faf2012-1fb5-459e-8fcc-c5c9c3319151';
const String kOtaDataUuid = '4faf2012-1fb5-459e-8fcc-c5c9c3319152';

const String kDeviceAdvertisedName = 'Grannas-T56';

const int kConfigOpcodeStartWrite = 0x01;
const int kConfigOpcodeCommit = 0x02;
const int kConfigOpcodeReadBack = 0x03;
const int kConfigOpcodeResetDefault = 0x04;

const int kOtaOpcodeBegin = 0x01;
const int kOtaOpcodeAbort = 0x02;
const int kOtaOpcodeFinalize = 0x03;

const int kConfigChunkPayload = 480;
const int kOtaChunkPayload = 480;

const List<String> kGearLabels = [
  'Neutral',
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  'Reverse',
];

const int kGearUnknown = 255;
