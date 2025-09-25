using FamilyExpenses.Domain.Common;
using FamilyExpenses.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using FamilyExpenses.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FamilyExpenses.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FamiliesController : ApiControllerBase
{
    private readonly IRepository<Family> _familyRepository;
    private readonly ApplicationDbContext _context;

    public FamiliesController(IRepository<Family> familyRepository, ApplicationDbContext context)
    {
        _familyRepository = familyRepository;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Family>>> GetFamilies()
    {
        var families = await _familyRepository.GetAllAsync();
        return Ok(families);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Family>> GetFamily(Guid id)
    {
        var family = await _familyRepository.GetByIdAsync(id);
        return HandleResult(family);
    }

    [HttpPost]
    public async Task<ActionResult<Family>> CreateFamily([FromBody] Family family)
    {
        family.Id = Guid.NewGuid();
        family.LastModified = DateTime.UtcNow;
        family.SyncId = Guid.NewGuid().ToString();
        
        var result = await _familyRepository.AddAsync(family);
        return CreatedAtAction(nameof(GetFamily), new { id = result.Id }, result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFamily(Guid id)
    {
        // Verify there are no related entities
        var hasCategories = await _context.Categories.AnyAsync(c => c.FamilyId == id);
        var hasMembers = await _context.FamilyMembers.AnyAsync(m => m.FamilyId == id);
        var hasBudgets = await _context.Budgets.AnyAsync(b => b.FamilyId == id);

        if (hasCategories || hasMembers || hasBudgets)
        {
            return Conflict(new { message = "Cannot delete family with related categories, members, or budgets." });
        }

        await _familyRepository.DeleteAsync(id);
        return NoContent();
    }
}