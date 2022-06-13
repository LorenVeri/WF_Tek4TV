using System;
using System.Collections.Generic;

namespace ProduceManager.Models
{
    public partial class Produce
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Data { get; set; }
        public string? Title { get; set; }
        public bool? IsDelete { get; set; }
        public DateTime? CreateAt { get; set; }
    }
}
