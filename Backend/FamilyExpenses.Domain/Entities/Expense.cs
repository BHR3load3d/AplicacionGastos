using System.Text.Json.Serialization;

namespace FamilyExpenses.Domain.Entities;

public class Expense
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public Guid CategoryId { get; set; }
    
    [JsonIgnore]
    public Category? Category { get; set; }
    
    public Guid FamilyMemberId { get; set; }
    
    [JsonIgnore]
    public FamilyMember? FamilyMember { get; set; }
    
    public string? Notes { get; set; }
    public DateTime LastModified { get; set; }
    public bool IsDeleted { get; set; }
    public string SyncId { get; set; } = string.Empty;
}