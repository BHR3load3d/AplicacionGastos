using FamilyExpenses.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FamilyExpenses.Infrastructure.Persistence.Configurations;

public class FamilyConfiguration : IEntityTypeConfiguration<Family>
{
    public void Configure(EntityTypeBuilder<Family> builder)
    {
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Name).IsRequired().HasMaxLength(100);
        builder.Property(f => f.LastModified).IsRequired();
        builder.Property(f => f.SyncId).IsRequired();
    }
}

public class FamilyMemberConfiguration : IEntityTypeConfiguration<FamilyMember>
{
    public void Configure(EntityTypeBuilder<FamilyMember> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Name).IsRequired().HasMaxLength(100);
        builder.Property(m => m.Email).HasMaxLength(256);
        builder.Property(m => m.LastModified).IsRequired();
        builder.Property(m => m.SyncId).IsRequired();

        builder.HasOne(m => m.Family)
            .WithMany(f => f.Members)
            .HasForeignKey(m => m.FamilyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Description).HasMaxLength(200);
        builder.Property(c => c.LastModified).IsRequired();
        builder.Property(c => c.SyncId).IsRequired();

        builder.HasOne(c => c.Family)
            .WithMany(f => f.Categories)
            .HasForeignKey(c => c.FamilyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Description).IsRequired().HasMaxLength(200);
        builder.Property(e => e.Amount).HasPrecision(18, 2);
        builder.Property(e => e.Date).IsRequired();
        builder.Property(e => e.LastModified).IsRequired();
        builder.Property(e => e.SyncId).IsRequired();

        builder.HasOne(e => e.Category)
            .WithMany(c => c.Expenses)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.FamilyMember)
            .WithMany(m => m.Expenses)
            .HasForeignKey(e => e.FamilyMemberId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BudgetConfiguration : IEntityTypeConfiguration<Budget>
{
    public void Configure(EntityTypeBuilder<Budget> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).IsRequired().HasMaxLength(100);
        builder.Property(b => b.Amount).HasPrecision(18, 2);
        builder.Property(b => b.StartDate).IsRequired();
        builder.Property(b => b.EndDate).IsRequired();
        builder.Property(b => b.LastModified).IsRequired();
        builder.Property(b => b.SyncId).IsRequired();

        builder.HasOne(b => b.Category)
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Family)
            .WithMany(f => f.Budgets)
            .HasForeignKey(b => b.FamilyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}