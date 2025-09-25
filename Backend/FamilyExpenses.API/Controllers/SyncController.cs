using FamilyExpenses.Application.DTOs;
using FamilyExpenses.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace FamilyExpenses.API.Controllers;

public class SyncController : ApiControllerBase
{
    private readonly ISyncService _syncService;

    public SyncController(ISyncService syncService)
    {
        _syncService = syncService;
    }

    [HttpPost("{familyId}")]
    public async Task<ActionResult<SyncResponse>> Sync(Guid familyId, [FromBody] SyncRequest request)
    {
        var response = await _syncService.SyncData(request, familyId);
        return Ok(response);
    }
}