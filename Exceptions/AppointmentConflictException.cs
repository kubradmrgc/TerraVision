namespace TerraVision.Api.Exceptions;

/// <summary>
/// The consultant time slot is no longer available (double booking or calendar change).
/// </summary>
public sealed class AppointmentConflictException : Exception
{
    public AppointmentConflictException(string message) : base(message) { }
}
