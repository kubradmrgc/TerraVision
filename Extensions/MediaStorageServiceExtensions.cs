using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using TerraVision.Api.Interfaces;
using TerraVision.Api.Services;
using TerraVision.Api.Services.Storage;
using TerraVision.Api.Settings;

namespace TerraVision.Api.Extensions;

public static class MediaStorageServiceExtensions
{
    public static IServiceCollection AddTerraVisionMediaStorage(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services.Configure<MediaStorageSettings>(configuration.GetSection(MediaStorageSettings.SectionName));
        var settings = configuration.GetSection(MediaStorageSettings.SectionName).Get<MediaStorageSettings>() ?? new MediaStorageSettings();

        var useS3 = !environment.IsEnvironment("Testing") &&
                    settings.Provider.Equals("S3", StringComparison.OrdinalIgnoreCase);

        if (useS3)
        {
            services.AddSingleton<IAmazonS3>(_ =>
            {
                var s3 = settings.S3;
                var config = new AmazonS3Config
                {
                    ForcePathStyle = s3.ForcePathStyle
                };

                if (!string.IsNullOrWhiteSpace(s3.ServiceUrl))
                {
                    config.ServiceURL = s3.ServiceUrl;
                }
                else if (!string.IsNullOrWhiteSpace(s3.Region))
                {
                    config.RegionEndpoint = RegionEndpoint.GetBySystemName(s3.Region);
                }

                if (!string.IsNullOrWhiteSpace(s3.AccessKey) && !string.IsNullOrWhiteSpace(s3.SecretKey))
                {
                    var credentials = new BasicAWSCredentials(s3.AccessKey, s3.SecretKey);
                    return new AmazonS3Client(credentials, config);
                }

                return new AmazonS3Client(config);
            });
            services.AddSingleton<IMediaBlobStorage, S3MediaBlobStorage>();
            services.AddSingleton<IMediaPresignService, S3MediaPresignService>();
        }
        else
        {
            services.AddSingleton<IMediaBlobStorage, LocalMediaBlobStorage>();
            services.AddSingleton<IMediaPresignService, UnsupportedMediaPresignService>();
        }

        services.AddScoped<IMediaService, MediaService>();
        return services;
    }
}
