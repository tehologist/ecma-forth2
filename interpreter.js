class OPCODE_TYPE {
    static get DATA        () { return 0; }
    static get PRIMITIVE   () { return 1; }
    static get IMMEDIATE   () { return 2; }
    static get CODE        () { return 3; }
    static get INTERPRETER () { return 4; }
}
class WordEntry {
    constructor (name, type, code) {
        this.name = name;
        this.code = code;
        this.type = type; }
}
class Interpreter {
    constructor(console, canvas) {
        this.dict = [];
        this.vm = new VirtualMachine(canvas);
        this.continue = true;
        this.compile = false;
	this.console = console;
        this.create('create',    OPCODE_TYPE.INTERPRETER, 1);
        this.create(':',         OPCODE_TYPE.INTERPRETER, 2);
        this.create(';',         OPCODE_TYPE.INTERPRETER, 3);
        this.create('immediate', OPCODE_TYPE.INTERPRETER, 4);
        this.create('.S',        OPCODE_TYPE.INTERPRETER, 5);
        this.create('D#',        OPCODE_TYPE.INTERPRETER, 6);
        this.create('H#',        OPCODE_TYPE.INTERPRETER, 7);
        this.create('B#',        OPCODE_TYPE.INTERPRETER, 8);
	this.create('nop',       OPCODE_TYPE.PRIMITIVE, 0);
	this.create('lit',       OPCODE_TYPE.PRIMITIVE, 1);
	this.create('call',      OPCODE_TYPE.PRIMITIVE, 2);
	this.create('return',    OPCODE_TYPE.PRIMITIVE, 3);
	this.create('@',         OPCODE_TYPE.PRIMITIVE, 4);
	this.create('!',         OPCODE_TYPE.PRIMITIVE, 5);
        this.create('+',         OPCODE_TYPE.PRIMITIVE, 6);
        this.create('-',         OPCODE_TYPE.PRIMITIVE, 7);
        this.create('*',         OPCODE_TYPE.PRIMITIVE, 8);
        this.create('/',         OPCODE_TYPE.PRIMITIVE, 9);
        this.create('%',         OPCODE_TYPE.PRIMITIVE, 10);
        this.create('&',         OPCODE_TYPE.PRIMITIVE, 11);
        this.create('|',         OPCODE_TYPE.PRIMITIVE, 12);
        this.create('~',         OPCODE_TYPE.PRIMITIVE, 13);
	this.create('dup',       OPCODE_TYPE.PRIMITIVE, 14);
	this.create('drop',      OPCODE_TYPE.PRIMITIVE, 15);
	this.create('swap',      OPCODE_TYPE.PRIMITIVE, 16);
	this.create('over',      OPCODE_TYPE.PRIMITIVE, 17);
        this.create('>r',        OPCODE_TYPE.PRIMITIVE, 18);
        this.create('r>',        OPCODE_TYPE.PRIMITIVE, 19);
        this.create('jz',        OPCODE_TYPE.PRIMITIVE, 20);
        this.create('jmp',       OPCODE_TYPE.PRIMITIVE, 21);
        this.create('>',         OPCODE_TYPE.PRIMITIVE, 22);
        this.create('=',         OPCODE_TYPE.PRIMITIVE, 23);
        this.create('<',         OPCODE_TYPE.PRIMITIVE, 24);
        this.create('put_pixel', OPCODE_TYPE.PRIMITIVE, 25);
        this.create('draw_screen',   OPCODE_TYPE.PRIMITIVE, 26);
        this.create('refresh_count', OPCODE_TYPE.PRIMITIVE, 27);
        this.create('rx?',           OPCODE_TYPE.PRIMITIVE, 28);
        this.create('<<',            OPCODE_TYPE.PRIMITIVE, 29);
        this.create('>>',            OPCODE_TYPE.PRIMITIVE, 30);
        this.create('^',             OPCODE_TYPE.PRIMITIVE, 31);
	
    }
    create (name, type, code) { this.dict.unshift(new WordEntry(name, type, code)); }
    word (input) { return input.shift(); }
    readline (input) { this.interpret(input.split(" ").filter(i => i)); } // i => i means return i if i is not empty
    find (value) {
        let found = null;
        this.dict.forEach(function(element) {
            if(!found && value === element.name) { found = element; }
        });
        return found; }
    interpret (input) {
        while(input.length && this.continue) {
            let word = this.word(input);
            if (word === '//') { break; } // Comment ignore rest of line
            if (word === 'S"') {
                let tmp_s = input.join(' ');
                let pad = this.vm.code[2] + 80; // scratch pad
                for(let x = 0; x < tmp_s.length; x++) { this.vm.code[pad++] = tmp_s.charCodeAt(x)|0; }
                this.vm.data_stack[++this.vm.ds_ndx] = this.vm.code[2] + 80;
                this.vm.data_stack[++this.vm.ds_ndx] = tmp_s.length;
                break;
            }
            if (word.length === 0) { continue; }
            let element = this.find(word);
            if (element) {
                if(element.type === OPCODE_TYPE.INTERPRETER) {this.op_interpret(element, input); }
                if(element.type === OPCODE_TYPE.DATA) { this.op_data(element); }
                if(element.type === OPCODE_TYPE.PRIMITIVE) { this.op_primitive(element); }
                if(element.type === OPCODE_TYPE.CODE) { this.op_code(element); }
                if(element.type === OPCODE_TYPE.IMMEDIATE) { this.op_immediate(element); } }
            else {
                    this.console('Error ' + word + ' not in dictionary.\n'); 
                    this.continue = false; }
        }
    }
    op_data(element, input) {
        if(this.compile ) {
            this.vm.push_code(1); // LIT 
            this.vm.push_code(element.code); }
        else { this.vm.data_stack[++this.vm.ds_ndx] = element.code; }
    }
    op_code(element, input) {
        if(this.compile) {
            this.vm.push_code(2); // CALL 
            this.vm.push_code(element.code); }
        else { this.vm.Run(element.code); }
    }
    op_immediate(element, input) { this.vm.Run(element.code); }
    op_primitive(element, input) { if(this.compile) { this.vm.push_code(element.code); } }
    op_number(radix, input) {
        let number = parseInt(this.word(input), radix);
        if (this.compile) {
            this.vm.push_code(1); // LIT 
            this.vm.push_code(number); }
        else { this.vm.data_stack[++this.vm.ds_ndx] = number; }
    }
    op_interpret(element, input) {
        switch(element.code) {
            case 1: // create 
                this.create(this.word(input), OPCODE_TYPE.DATA, this.vm.code[2]);
                break;
            case 2: // :
              this.create(this.word(input), OPCODE_TYPE.CODE, this.vm.code[2]);
              this.compile = true;
              break;
            case 3: // ;
                this.vm.push_code(3); // RETURN 
                this.compile = false;
                break;
            case 4: // immediate 
                this.dict[0].type = OPCODE_TYPE.IMMEDIATE;
                break;
            case 5: // .S 
            {   
		let ds = this.vm.ds_ndx > -1 ? this.vm.data_stack.slice(0, this.vm.ds_ndx+1) : []; 
		this.console('Data stack: ' + ds + '\n');
	    }
                break;
            case 6: // D# 
                this.op_number(10, input);
                break;
            case 7: // H# 
                this.op_number(16, input);
                break;
            case 8: // B# 
                this.op_number(2, input);
                break;
            default:
	        break;
        }
    }
}
