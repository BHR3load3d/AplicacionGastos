using FamilyExpenses.Application.DTOs;
using FamilyExpenses.Domain.Common;
using FamilyExpenses.Domain.Entities;
using System.Linq;

namespace FamilyExpenses.Application.Services;

public interface ISyncService
{
    Task<SyncResponse> SyncData(SyncRequest request, Guid familyId);
}

public class SyncService : ISyncService
{
    private readonly IRepository<Expense> _expenseRepository;
    private readonly IRepository<Category> _categoryRepository;
    private readonly IRepository<Budget> _budgetRepository;

    public SyncService(
        IRepository<Expense> expenseRepository,
        IRepository<Category> categoryRepository,
        IRepository<Budget> budgetRepository)
    {
        _expenseRepository = expenseRepository;
        _categoryRepository = categoryRepository;
        _budgetRepository = budgetRepository;
    }

    public async Task<SyncResponse> SyncData(SyncRequest request, Guid familyId)
    {
        var serverTimestamp = DateTime.UtcNow;
        var conflicts = new List<ConflictDto>();

        // Apply client changes - Categories
        foreach (var c in request.Categories)
        {
            if (!Guid.TryParse(string.IsNullOrWhiteSpace(c.Id) ? null : c.Id, out var cid))
            {
                cid = Guid.NewGuid();
            }

            var existing = await _categoryRepository.GetByIdAsync(cid);
            if (existing is null)
            {
                var entity = new Category
                {
                    Id = cid,
                    Name = c.Name,
                    Description = c.Description,
                    FamilyId = familyId,
                    LastModified = serverTimestamp,
                    IsDeleted = false,
                    SyncId = string.IsNullOrWhiteSpace(c.SyncId) ? Guid.NewGuid().ToString() : c.SyncId,
                };
                await _categoryRepository.AddAsync(entity);
            }
            else
            {
                // basic last-write-wins
                existing.Name = c.Name;
                existing.Description = c.Description;
                existing.FamilyId = familyId;
                existing.LastModified = serverTimestamp;
                await _categoryRepository.UpdateAsync(existing);
            }
        }

        // Apply client changes - Expenses
        foreach (var x in request.Expenses)
        {
            // Validate and parse identifiers
            var hasGuidId = Guid.TryParse(string.IsNullOrWhiteSpace(x.Id) ? null : x.Id, out var xid);
            if (!Guid.TryParse(string.IsNullOrWhiteSpace(x.CategoryId) ? null : x.CategoryId, out var xCategoryId))
            {
                conflicts.Add(new ConflictDto
                {
                    EntityType = nameof(Expense),
                    EntityId = x.Id,
                    ConflictType = "InvalidCategoryId",
                    ClientVersion = x
                });
                continue;
            }

            // Ensure category belongs to provided family
            var cat = await _categoryRepository.GetByIdAsync(xCategoryId);
            if (cat == null || cat.FamilyId != familyId)
            {
                conflicts.Add(new ConflictDto
                {
                    EntityType = nameof(Expense),
                    EntityId = x.Id,
                    ConflictType = "CategoryNotInFamily",
                    ClientVersion = x
                });
                continue;
            }

            Guid.TryParse(string.IsNullOrWhiteSpace(x.FamilyMemberId) ? null : x.FamilyMemberId, out var xMemberId);

            if (!hasGuidId)
            {
                xid = Guid.NewGuid();
            }

            var existingExpense = await _expenseRepository.GetByIdAsync(xid);
            if (existingExpense is null)
            {
                var entity = new Expense
                {
                    Id = xid,
                    Description = x.Description,
                    Amount = x.Amount,
                    Date = x.Date,
                    CategoryId = xCategoryId,
                    FamilyMemberId = xMemberId,
                    Notes = x.Notes,
                    LastModified = serverTimestamp,
                    IsDeleted = x.IsDeleted,
                    SyncId = string.IsNullOrWhiteSpace(x.SyncId) ? Guid.NewGuid().ToString() : x.SyncId,
                };
                await _expenseRepository.AddAsync(entity);
            }
            else
            {
                // basic last-write-wins
                existingExpense.Description = x.Description;
                existingExpense.Amount = x.Amount;
                existingExpense.Date = x.Date;
                existingExpense.CategoryId = xCategoryId;
                existingExpense.FamilyMemberId = xMemberId;
                existingExpense.Notes = x.Notes;
                existingExpense.IsDeleted = x.IsDeleted;
                existingExpense.LastModified = serverTimestamp;
                await _expenseRepository.UpdateAsync(existingExpense);
            }
        }

        // Obtain server-side changes since client's last sync
        var allServerExpenses = await _expenseRepository.GetModifiedSinceAsync(request.LastSyncTimestamp);
        var allCategories = await _categoryRepository.GetAllAsync();
        var familyCategoryIds = allCategories.Where(c => c.FamilyId == familyId).Select(c => c.Id).ToHashSet();
        var serverExpenses = allServerExpenses.Where(e => familyCategoryIds.Contains(e.CategoryId)).ToList();

        var serverCategories = (await _categoryRepository.GetModifiedSinceAsync(request.LastSyncTimestamp))
            .Where(c => c.FamilyId == familyId)
            .ToList();

        var serverBudgetsAll = await _budgetRepository.GetModifiedSinceAsync(request.LastSyncTimestamp);
        var serverBudgets = serverBudgetsAll.Where(b => b.FamilyId == familyId).ToList();

        return new SyncResponse
        {
            ServerTimestamp = serverTimestamp,
            Expenses = serverExpenses.Select(e => new ExpenseDto
            {
                Id = e.Id.ToString(),
                Description = e.Description,
                Amount = e.Amount,
                Date = e.Date,
                CategoryId = e.CategoryId.ToString(),
                FamilyMemberId = e.FamilyMemberId.ToString(),
                Notes = e.Notes,
                LastModified = e.LastModified,
                IsDeleted = e.IsDeleted,
                SyncId = e.SyncId
            }),
            Categories = serverCategories.Select(c => new CategoryDto
            {
                Id = c.Id.ToString(),
                Name = c.Name,
                Description = c.Description,
                FamilyId = c.FamilyId.ToString(),
                LastModified = c.LastModified,
                IsDeleted = c.IsDeleted,
                SyncId = c.SyncId
            }),
            Budgets = serverBudgets.Select(b => new BudgetDto
            {
                Id = b.Id.ToString(),
                Name = b.Name,
                Amount = b.Amount,
                StartDate = b.StartDate,
                EndDate = b.EndDate,
                CategoryId = b.CategoryId.ToString(),
                FamilyId = b.FamilyId.ToString(),
                LastModified = b.LastModified,
                IsDeleted = b.IsDeleted,
                SyncId = b.SyncId
            }),
            Conflicts = conflicts
        };
    }
}