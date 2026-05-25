namespace TerraVision.Api.Enums
{
    public enum AppointmentStatus 
    { 
        Pending = 1, Approved = 2, Completed = 3, Cancelled = 4 
    }

    /// <summary>Post-visit outcome recorded by consultant or admin.</summary>
    public enum AppointmentOutcome
    {
        None = 0,
        ConvertedToSale = 1,
        NoSale = 2,
        FollowUpRequired = 3
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

    public enum CareActionType
    {
        Watering = 1,
        Fertilizing = 2,
        Cleaning = 3
    }

    public enum CareTaskUrgency
    {
        None = 0,
        Upcoming = 1,
        DueToday = 2,
        Overdue = 3
    }

    public enum ExchangeCondition
    {
        New = 1,
        Used = 2,
        Healthy = 3
    }

    public enum ExchangeProductStatus
    {
        Available = 1,
        Pending = 2,
        Completed = 3
    }

    public enum ExchangeOfferType
    {
        Swap = 1,
        Buy = 2
    }

    public enum ExchangeOfferStatus
    {
        Pending = 1,
        Accepted = 2,
        Rejected = 3
    }
}