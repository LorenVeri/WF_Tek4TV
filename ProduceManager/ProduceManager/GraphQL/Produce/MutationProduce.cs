using ProduceManager.Models;

namespace ProduceManager.GraphQL.Produce
{
    [ExtendObjectType("Mutation")]
    public class MutationProduce
    {
        [UseDbContext(typeof(DatabaseContext))]
        public async Task<bool> CreateProduceAsync([ScopedService] DatabaseContext context, ProduceInput item)
        {
            var id = item.Id;
            try
            {
                if (id == 0)
                {
                    var produce = new Models.Produce
                    {
                        Id = id,
                        Data = item.Data,
                        Name = item.Name,
                        CreateAt = DateTime.Now,
                        IsDelete = item.IsDelete
                    };

                    context.Produces.Add(produce);
                    await context.SaveChangesAsync();

                    return true;
                }
                else
                {
                    var produce = context.Produces.FirstOrDefault(p => p.Id == id);
                    if (produce == null)
                    {
                        return false;
                    }
                    else
                    {
                        produce.Name = item.Name;
                        produce.Data = item.Data;
                        produce.IsDelete = item.IsDelete;
                        context.Produces.Update(produce);
                        await context.SaveChangesAsync();
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        [UseDbContext(typeof(DatabaseContext))]
        public async Task<bool> DeleteProduceAsync([ScopedService] DatabaseContext context, int id)
        {
            if(id > 0)
            {
                var produce = context.Produces.Find(id);
                if(produce == null)
                {
                    return false;
                }else
                {
                    return true;
                }
            }else
            {
                return false;
            }
        }
    }
}
