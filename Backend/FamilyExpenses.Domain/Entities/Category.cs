using System.Text.Json.Serialization;

namespace FamilyExpenses.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid FamilyId { get; set; }
    
    [JsonIgnore]
    public Family? Family { get; set; }
    
    [JsonIgnore]
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    
    public DateTime LastModified { get; set; }
    public bool IsDeleted { get; set; }
    public string SyncId { get; set; } = string.Empty;
}