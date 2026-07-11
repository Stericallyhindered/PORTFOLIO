import '../domain/pwm_command.dart';

abstract class PwmCommandSink {
  Future<void> write(PwmCommand cmd);

  bool get canAcceptCommands;
}
