using Microsoft.EntityFrameworkCore;
using ProduceManager.GraphQL.Produce;
using ProduceManager.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

var connectionString = builder.Configuration.GetConnectionString("DatabaseConnection");
builder.Services.AddPooledDbContextFactory<DatabaseContext>(o => o.UseSqlServer(connectionString));
//Scaffold-DbContext "Server=DESKTOP-AMJ7HPS;Database=Procedure_Manager;Trusted_Connection=True;" Microsoft.EntityFrameworkCore.SqlServer -OutputDir Models -Context DatabaseContext -force

//CORS 
var AllowAll = "_AllowAll";

builder.Services.AddCors(options =>
{
    options.AddPolicy(
            name: AllowAll,
            policy =>
            {
                policy.AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
});

builder.Services
        .AddGraphQLServer()
        .AddQueryType(x => x.Name("Query"))
        .AddTypeExtension<QueryProduce>()
        .AddMutationType(x => x.Name("Mutation"))
        .AddTypeExtension<MutationProduce>()
        .AddProjections()
        .AddFiltering()
        .AddSorting();


var app = builder.Build();
    
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseCors(AllowAll);
app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapGraphQL();
});

app.Run();
