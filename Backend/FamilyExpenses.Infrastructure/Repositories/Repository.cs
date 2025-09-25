using FamilyExpenses.Domain.Common;
using FamilyExpenses.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyExpenses.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    private readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<T>> GetModifiedSinceAsync(DateTime timestamp)
    {
        // Asumimos que las entidades implementan una propiedad LastModified
        var type = typeof(T);
        var lastModifiedProperty = type.GetProperty("LastModified");
        
        if (lastModifiedProperty == null)
            throw new InvalidOperationException($"Entity {type.Name} does not have LastModified property");

        return await _dbSet
            .AsQueryable()
            .Where(e => EF.Property<DateTime>(e, "LastModified") > timestamp)
            .ToListAsync();
    }
}