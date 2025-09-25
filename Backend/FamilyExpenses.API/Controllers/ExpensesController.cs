using FamilyExpenses.Domain.Common;
using FamilyExpenses.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FamilyExpenses.Infrastructure.Persistence;

namespace FamilyExpenses.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ApiControllerBase
{
    private readonly IRepository<Expense> _expenseRepository;
    private readonly ApplicationDbContext _context;

    public ExpensesController(IRepository<Expense> expenseRepository, ApplicationDbContext context)
    {
        _expenseRepository = expenseRepository;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Expense>>> GetExpenses([FromQuery] Guid? familyId = null)
    {
        var query = _context.Expenses.AsQueryable();
        
        if (familyId.HasValue)
        {
            query = query.Where(e => e.FamilyMember != null && e.FamilyMember.FamilyId == familyId);
        }

        var expenses = await query
            .Include(e => e.Category)
            .Include(e => e.FamilyMember)
            .ToListAsync();

        return Ok(expenses);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Expense>> GetExpense(Guid id)
    {
        var expense = await _context.Expenses
            .Include(e => e.Category)
            .Include(e => e.FamilyMember)
            .FirstOrDefaultAsync(e => e.Id == id);

        return HandleResult(expense);
    }

    [HttpPost]
    public async Task<ActionResult<Expense>> CreateExpense([FromBody] Expense expense)
    {
        expense.Id = Guid.NewGuid();
        expense.LastModified = DateTime.UtcNow;
        expense.SyncId = Guid.NewGuid().ToString();
        
        var result = await _expenseRepository.AddAsync(expense);
        return CreatedAtAction(nameof(GetExpense), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Expense>> UpdateExpense(Guid id, [FromBody] Expense expense)
    {
        if (id != expense.Id)
            return BadRequest();

        expense.LastModified = DateTime.UtcNow;
        await _expenseRepository.UpdateAsync(expense);
        return Ok(expense);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteExpense(Guid id)
    {
        await _expenseRepository.DeleteAsync(id);
        return NoContent();
    }
}