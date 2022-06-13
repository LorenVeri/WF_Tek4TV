using ProduceManager.Models;

namespace ProduceManager.GraphQL.Produce
{
    [ExtendObjectType("Query")]
    public class QueryProduce
    {
        [UseDbContext(typeof(DatabaseContext))]
        [UsePaging(IncludeTotalCount = true, MaxPageSize = 100)]
        [UseProjection]
        [UseFiltering]
        [UseSorting]
        public IQueryable<Models.Produce> GetProduce([ScopedService] DatabaseContext context)
        {
            IQueryable<Models.Produce> query = context.Produces.AsQueryable();
            return query;
        }
    }
}
