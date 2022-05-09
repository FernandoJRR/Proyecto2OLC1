jison ./crl_parser.jison; 
'import { ErrorList } from "./manejo_error/ErrorList";' | save --raw --append temp;
open --raw ./crl_parser.js | save --raw --append temp;
mv temp ./crl_parser.js