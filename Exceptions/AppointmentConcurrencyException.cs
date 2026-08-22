namespace TerraVision.Api.Exceptions;

/// <summary>
/// Another user updated the same appointment before this request was saved.
/// </summary>
public sealed class AppointmentConcurrencyException : Exception
{
    public AppointmentConcurrencyException(string message) : base(message) { }
}
