using FamilyExpenses.Domain.Common;
using FamilyExpenses.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FamilyExpenses.Infrastructure.Persistence;

namespace FamilyExpenses.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ApiControllerBase
{
    private readonly IRepository<Category> _categoryRepository;
    private readonly ApplicationDbContext _context;

    public CategoriesController(IRepository<Category> categoryRepository, ApplicationDbContext context)
    {
        _categoryRepository = categoryRepository;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories([FromQuery] Guid? familyId = null)
    {
        var query = _context.Categories.AsQueryable();
        
        if (familyId.HasValue)
        {
            query = query.Where(c => c.FamilyId == familyId);
        }

        var categories = await query.ToListAsync();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Category>> GetCategory(Guid id)
    {
        var category = await _categoryRepository.GetByIdAsync(id);
        return HandleResult(category);
    }

    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory([FromBody] Category category)
    {
        category.Id = Guid.NewGuid();
        category.LastModified = DateTime.UtcNow;
        category.SyncId = Guid.NewGuid().ToString();
        
        var result = await _categoryRepository.AddAsync(category);
        return CreatedAtAction(nameof(GetCategory), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Category>> UpdateCategory(Guid id, [FromBody] Category category)
    {
        if (id != category.Id)
            return BadRequest();

        category.LastModified = DateTime.UtcNow;
        await _categoryRepository.UpdateAsync(category);
        return Ok(category);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCategory(Guid id)
    {
        await _categoryRepository.DeleteAsync(id);
        return NoContent();
    }
}