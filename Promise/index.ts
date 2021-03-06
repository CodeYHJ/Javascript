type IStats = "pedding" | "fulfilled" | "reject";

type IFn = (resolve: Function, reject: Function) => void;
type ISucess = (result: unknown) => any | null;
type IReject = (resaon: unknown) => any | null;
type IThen = (sucess: ISucess | null, fail?: IReject) => MyPromise;

type IHandleFn = [Function | undefined, Function | undefined, MyPromise];

class MyPromise {
  callBacks: IHandleFn[] = [];
  stats: IStats = "pedding";
  resolveFn(result: unknown) {
    if (this.stats !== "pedding") return;
    this.stats = "fulfilled";
    $nextTick(() => {
      this.callBacks.forEach((handle) => {
        if (typeof handle[0] === "function") {
          let x;
          try {
            x = handle[0].call(undefined, result);
          } catch (error) {
            return handle[2].rejectFn(error);
          }
          handle[2].resolveWith(x);
        }
      });
    });
  }
  rejectFn(resaon: unknown) {
    if (this.stats !== "pedding") return;
    this.stats = "reject";
    $nextTick(() => {
      this.callBacks.forEach((handle) => {
        if (typeof handle[1] === "function") {
          let x;
          try {
            x = handle[1].call(undefined, resaon);
          } catch (error) {
            return handle[2].rejectFn(error);
          }
          handle[2].resolveWith(x);
        }
      });
    });
  }
  constructor(fn: IFn) {
    if (typeof fn !== "function") {
      throw new Error("promise 必须接收一个函数");
    }
    fn(this.resolveFn.bind(this), this.rejectFn.bind(this));
  }
  then: IThen = (sucess, fail) => {
    let handle = [];
    if (typeof sucess === "function") {
      handle[0] = sucess;
    }
    if (typeof fail === "function") {
      handle[1] = fail;
    }
    handle[2] = new MyPromise(() => {});
    this.callBacks.push(handle as IHandleFn);
    return handle[2];
  };
  resolveWith = (x: unknown) => {
    if (x === this) {
      return this.rejectFn(TypeError("x 和 promise 不能为同一个引用"));
    } else if (x instanceof MyPromise) {
      x.then(
        (result) => {
          this.resolveFn(result);
        },
        (reason) => {
          this.rejectFn(reason);
        }
      );
    } else if (x instanceof Object) {
      let then;
      try {
        //   @ts-ignore
        then = x.then;
      } catch (error) {
        this.rejectFn(error);
      }
      if (then instanceof Function) {
        try {
          //   @ts-ignore
          x.then(
            (y: unknown) => {
              this.resolveWith(y);
            },
            (r: unknown) => {
              this.rejectFn(r);
            }
          );
        } catch (error) {
          this.rejectFn(error);
        }
      } else {
        this.resolveFn(x);
      }
    } else {
      this.resolveFn(x);
    }
  };
}
const $nextTick = (fn: any) => {
  if (process !== undefined && typeof process.nextTick === "function") {
    return process.nextTick(fn);
  } else {
    let count = 1;
    const observer = new MutationObserver(fn);
    const textNode = document.createTextNode(String(count));
    observer.observe(textNode, { characterData: true });
    count = count + 1;
    textNode.data = String(count);
  }
};
export default MyPromise;
