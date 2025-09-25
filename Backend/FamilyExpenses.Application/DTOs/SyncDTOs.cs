namespace FamilyExpenses.Application.DTOs;

public class SyncRequest
{
    public DateTime LastSyncTimestamp { get; set; }
    public IEnumerable<ExpenseDto> Expenses { get; set; } = new List<ExpenseDto>();
    public IEnumerable<CategoryDto> Categories { get; set; } = new List<CategoryDto>();
    public IEnumerable<BudgetDto> Budgets { get; set; } = new List<BudgetDto>();
}

public class SyncResponse
{
    public DateTime ServerTimestamp { get; set; }
    public IEnumerable<ExpenseDto> Expenses { get; set; } = new List<ExpenseDto>();
    public IEnumerable<CategoryDto> Categories { get; set; } = new List<CategoryDto>();
    public IEnumerable<BudgetDto> Budgets { get; set; } = new List<BudgetDto>();
    public IEnumerable<ConflictDto> Conflicts { get; set; } = new List<ConflictDto>();
}

public class ConflictDto
{
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string ConflictType { get; set; } = string.Empty;
    public object? ServerVersion { get; set; }
    public object? ClientVersion { get; set; }
}