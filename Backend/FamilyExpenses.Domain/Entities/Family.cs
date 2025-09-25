using System.Text.Json.Serialization;

namespace FamilyExpenses.Domain.Entities;

public class Family
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    [JsonIgnore]
    public ICollection<FamilyMember> Members { get; set; } = new List<FamilyMember>();
    
    [JsonIgnore]
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    
    [JsonIgnore]
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
    
    public DateTime LastModified { get; set; }
    public bool IsDeleted { get; set; }
    public string SyncId { get; set; } = string.Empty;
}