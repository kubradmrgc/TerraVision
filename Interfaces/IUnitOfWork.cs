namespace TerraVision.Api.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        Task<int> CommitAsync();
        void Commit();
    }
}
