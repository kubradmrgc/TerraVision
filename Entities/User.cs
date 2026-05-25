using TerraVision.Api.Entities.Common;
using TerraVision.Api.Enums;

namespace TerraVision.Api.Entities
{
    public class User : BaseEntity
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
        
        public UserRole Role { get; set; } = UserRole.Customer;
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiresAtUtc { get; set; }

        public virtual Cart? Cart { get; set; }
        public virtual ICollection<Order> Orders { get; set; } = new HashSet<Order>();
        public virtual ICollection<Appointment> CustomerAppointments { get; set; } = new HashSet<Appointment>();
        public virtual ICollection<Appointment> ConsultantAppointments { get; set; } = new HashSet<Appointment>();
        public virtual ICollection<ArSession> ArSessions { get; set; } = new HashSet<ArSession>();
        public virtual ICollection<PlantCareCalendar> PlantCareCalendars { get; set; } = new HashSet<PlantCareCalendar>();
        public virtual ICollection<ExchangeProduct> ExchangeProducts { get; set; } = new HashSet<ExchangeProduct>();
        public virtual ICollection<ExchangeOffer> ExchangeOffersSent { get; set; } = new HashSet<ExchangeOffer>();
    }
}