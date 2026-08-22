namespace TerraVision.Api.Interfaces;

public interface IMediaBlobStorage
{
    Task<MediaBlobUploadResult> UploadAsync(
        Stream content,
        string objectKey,
        string contentType,
        CancellationToken cancellationToken = default);

    string GetPublicUrl(string objectKey);

    /// <summary>Resolves stored path, file name, or full URL to a client-facing URL.</summary>
    string ResolveClientUrl(string? storedValue, string folderPrefix, string? fallbackFileName = null);
}

public sealed class MediaBlobUploadResult
{
    public required string ObjectKey { get; init; }
    public required string PublicUrl { get; init; }
    public long Size { get; init; }
}
