using System.Text;
using Microsoft.Extensions.Options;
using TerraVision.Api.Entities;
using TerraVision.Api.Enums;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Models.Auth;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly JwtSettings _jwtSettings;

        public AuthService(
            IRepository<User> userRepository, 
            IUnitOfWork unitOfWork,
            IJwtTokenGenerator jwtTokenGenerator,
            IOptions<JwtSettings> jwtOptions)
        {
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _jwtTokenGenerator = jwtTokenGenerator;
            _jwtSettings = jwtOptions.Value;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.SingleOrDefaultAsync(x => x.Email == request.Email);
            
            if (user == null)
                throw new UnauthorizedAccessException("Invalid email or password.");

            var storedPassword = Encoding.UTF8.GetString(user.PasswordHash);
            var isBcryptHash = storedPassword.StartsWith("$2a$") ||
                               storedPassword.StartsWith("$2b$") ||
                               storedPassword.StartsWith("$2y$");
            if (!isBcryptHash)
            {
                throw new InvalidOperationException(
                    "Your password hash format is outdated. Reset password or apply database migrations.");
            }

            var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, storedPassword);
            
            if (!isPasswordValid)
                throw new UnauthorizedAccessException("Invalid email or password.");

            return await BuildAndPersistAuthResponseAsync(user);
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var existingUser = await _userRepository.SingleOrDefaultAsync(x => x.Email == request.Email);
            
            if (existingUser != null)
                throw new InvalidOperationException("Email already exists.");

            string passwordHashString = BCrypt.Net.BCrypt.HashPassword(request.Password);
            byte[] passwordHash = System.Text.Encoding.UTF8.GetBytes(passwordHashString);

            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                // Public registration is unauthenticated — never honor a client-supplied role.
                Role = UserRole.Customer,
                PasswordHash = passwordHash,
                // Salt is typically handled inside the BCrypt hash format itself now, 
                // but setting to empty or a basic value to avoid EF Core empty array issues if required
                PasswordSalt = Array.Empty<byte>() 
            };

            await _userRepository.AddAsync(user);
            await _unitOfWork.CommitAsync();

            return await BuildAndPersistAuthResponseAsync(user);
        }

        public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var user = await _userRepository.SingleOrDefaultAsync(x =>
                x.RefreshToken == request.RefreshToken &&
                x.RefreshTokenExpiresAtUtc != null &&
                x.RefreshTokenExpiresAtUtc > DateTime.UtcNow);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid or expired refresh token.");
            }

            return await BuildAndPersistAuthResponseAsync(user);
        }

        public async Task LogoutAsync(int userId)
        {
            var user = await _userRepository.SingleOrDefaultAsync(x => x.Id == userId && !x.IsDeleted);
            if (user == null)
            {
                return;
            }

            user.RefreshToken = null;
            user.RefreshTokenExpiresAtUtc = null;
            user.UpdatedDate = DateTime.UtcNow;

            _userRepository.Update(user);
            await _unitOfWork.CommitAsync();
        }

        private async Task<AuthResponse> BuildAndPersistAuthResponseAsync(User user)
        {
            var accessToken = _jwtTokenGenerator.GenerateToken(user);
            var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();
            var accessTokenExpiry = _jwtTokenGenerator.GetAccessTokenExpiryUtc();
            var refreshTokenExpiry = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays);

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiresAtUtc = refreshTokenExpiry;
            user.UpdatedDate = DateTime.UtcNow;

            _userRepository.Update(user);
            await _unitOfWork.CommitAsync();

            return new AuthResponse
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                AccessTokenExpiresAtUtc = accessTokenExpiry,
                RefreshTokenExpiresAtUtc = refreshTokenExpiry,
                UserId = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                Role = user.Role
            };
        }
    }
}
