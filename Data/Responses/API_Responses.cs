﻿namespace Gentle_Blossom_FE.Data.Responses
{
    public class API_Response<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
    }
}
