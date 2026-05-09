FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src
COPY . .
RUN dotnet restore "HackathonGame.CardsService/HackathonGame.CardsService.csproj"
RUN dotnet publish "HackathonGame.CardsService/HackathonGame.CardsService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8082
ENV ASPNETCORE_URLS=http://0.0.0.0:8082
ENV ASPNETCORE_ENVIRONMENT=Development
ENTRYPOINT ["dotnet", "HackathonGame.CardsService.dll"]
