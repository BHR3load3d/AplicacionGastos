using System.Text.Json.Serialization;

namespace FamilyExpenses.Domain.Entities;

public class Budget
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public Guid CategoryId { get; set; }
    
    [JsonIgnore]
    public Category? Category { get; set; }
    
    public Guid FamilyId { get; set; }
    
    [JsonIgnore]
    public Family? Family { get; set; }
    
    public DateTime LastModified { get; set; }
    public bool IsDeleted { get; set; }
    public string SyncId { get; set; } = string.Empty;
}