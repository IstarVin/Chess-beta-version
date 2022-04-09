$(function () {
    $("#joinRoom").on("click", () => {
        $("#pickColorContainer").css("visibility", "hidden")
        $("#joinContainer").css("visibility", "visible")
    })
    
    $("body").on("keydown", (e) => {
        if (e.key === "Escape") {
            $("#joinContainer").css("visibility", "hidden")
            $("#pickColorContainer").css("visibility", "hidden")
        }
    })

    $("#joinButton").on("click", () => {
        window.location.href = "/chess/join-room?id=" + $("#room").val().replace(/\W/g, "")
    })
    $("#createRoom").on("click", () => {
        $("#joinContainer").css("visibility", "hidden")
        $("#pickColorContainer").css("visibility", "visible")
        //window.location.href = "/create-room"
    })
    $("#colorSelect").on("change", () => {
        let color = $("#colorSelect").val()
        window.location.href = "/chess/create-room?color=" + color
    })
    $("#freePlay").on("click", () => window.location.href = "/chess")
})