using TerraVision.Api.Interfaces;

namespace TerraVision.Api.Data
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly TerraVisionDbContext _context;

        public UnitOfWork(TerraVisionDbContext context)
        {
            _context = context;
        }

        public void Commit()
        {
            _context.SaveChanges();
        }

        public async Task<int> CommitAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
