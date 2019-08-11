interface Pixel {
    r:number,
    g:number,
    b:number,
    a:number
}
interface PixelMask {
    r:boolean,
    g:boolean,
    b:boolean,
    a:boolean
}


interface Dimension {
    x: number,
    y : number
}
interface Coordinate {
    x: number,
    y: number
}
interface WriteCommand {
    data: boolean[],
    offset: number
}
