namespace FamilyExpenses.Application.DTOs;

public class ExpenseDto
{
    public string Id { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string CategoryId { get; set; } = string.Empty;
    public string FamilyMemberId { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime LastModified { get; set; }
    public bool IsDeleted { get; set; }
    public string SyncId { get; set; } = string.Empty;
}

public class CategoryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FamilyId { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
    public bool IsDeleted { get; set; }
    public string SyncId { get; set; } = string.Empty;
}

public class BudgetDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string CategoryId { get; set; } = string.Empty;
    public string FamilyId { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
    public bool IsDeleted { get; set; }
    public string SyncId { get; set; } = string.Empty;
}

public class FamilyMemberDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string FamilyId { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
    public bool IsDeleted { get; set; }
    public string SyncId { get; set; } = string.Empty;
}