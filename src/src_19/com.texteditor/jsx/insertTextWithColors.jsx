function insertTextWithColors(data) {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Пожалуйста, откройте композицию.");
        return;
    }

    var selectedLayer = comp.selectedLayers[0]; // Получаем выделенный слой
    if (!selectedLayer || selectedLayer.property("ADBE Text Properties") === null) {
        alert("Пожалуйста, выделите текстовый слой.");
        return;
    }

    var textProp = selectedLayer.property("ADBE Text Properties").property("ADBE Text Document");
    var textDocument = textProp.value;

    for (var i = 0; i < data.length; i++) {
        var part = data[i];
        var text = part.text;
        var color = part.color;

        // Добавляем текст с цветом
        textDocument.text += text;
        var animator = selectedLayer.property("ADBE Text Properties").property("ADBE Text Animators").addProperty("ADBE Text Animator");
        var fillColor = animator.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
        var selector = animator.property("ADBE Text Selectors").addProperty("ADBE Text Selector");

        selector.property("ADBE Text Selector Options").property("ADBE Text Selector Start").setValue(textDocument.text.length - text.length);
        selector.property("ADBE Text Selector Options").property("ADBE Text Selector End").setValue(textDocument.text.length);
        fillColor.property("ADBE Text Fill Color").setValue(color);
    }

    // Обновляем текст в выделенном слое
    textProp.setValue(textDocument);

    return "success";
}

// Вызов функции
insertTextWithColors(data);
