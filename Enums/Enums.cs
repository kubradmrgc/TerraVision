namespace TerraVision.Api.Enums
{
    public enum AppointmentStatus 
    { 
        Pending = 1, Approved = 2, Completed = 3, Cancelled = 4 
    }

    public enum UserRole 
    { 
        Customer = 1, Consultant = 2, Admin = 3 
    }

    public enum OrderStatus
    {
        Pending = 1,
        Confirmed = 2,
        Shipped = 3,
        Delivered = 4,
        Cancelled = 5
    }
}