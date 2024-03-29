var consoleData = "";
var consoleLine = "";
var selected = true;

var interpreter = new Interpreter(function(s) { consoleData += s; }, "screen");
function readLine(s) {
    consoleData += s + "\n";
    interpreter.continue = true;
    interpreter.readline(s);
}
function readFileLine(s) {
    readLine(s);
    console = document.getElementById('console');
    console.innerHTML = consoleData + "OK. " + consoleLine;
    console.scrollTop = console.scrollHeight;
}
function dropHandler(ev) {
    fr = new FileReader();
    fr.onload = function(ev) { ev.target.result.replace(/\r?\n/g, '\n').split('\n').forEach(readFileLine); }
    let f = ev.dataTransfer.items[0].getAsFile();
    fr.readAsText(f);
    ev.preventDefault();
}
function dragOverHandler(ev) { ev.preventDefault(); }
function toLoad() {
    document.getElementById('dropcode').addEventListener('drop', dropHandler);
    document.getElementById('dropcode').addEventListener('dragover', dragOverHandler);
    document.getElementById('console_parent').addEventListener('click', function(event) {
        selected = true;
        document.getElementById('screen').style.borderColor = "White";     
        document.getElementById('console').style.borderColor = "Green";  
    });
    document.getElementById('screen_parent').addEventListener('click', function(event) {
        selected = false;
        document.getElementById('console').style.borderColor = "White";     
        document.getElementById('screen').style.borderColor = "Green";  
    });
    document.addEventListener('keydown', function(event) {
        if(selected) {
            if(event.key === "Enter") { readLine(consoleLine);consoleLine = ""; }
            else if(event.key === "Backspace") { consoleLine = consoleLine.slice(0,-1); }
            else { 
		    if(event.keyCode > 31 && event.keyCode < 255) 
		        consoleLine += String.fromCharCode(event.key.charCodeAt()); 
	    }
            console = document.getElementById('console');
            console.innerHTML = consoleData + "OK. " + consoleLine;
            console.scrollTop = console.scrollHeight;
        }
        event.preventDefault();
    }); 
}
toLoad();
function main(t_frame) {
    window.requestAnimationFrame(main);
    interpreter.vm.CONTINUE(t_frame);
}
main(0);
